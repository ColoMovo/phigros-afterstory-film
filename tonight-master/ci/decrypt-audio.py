"""Restore the declared song into this production's private CI directory.

The archived format is nonce[12] + tag[16] + ciphertext. --check-contract reads
only the public manifest and encrypted-file metadata; it never reads a key.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "assets/assets-manifest.json"
ENCRYPTED = ROOT / "assets/private-input/music.enc"
TARGET = ROOT / "tonight-master/private/song.mp3"
TARGET_RELATIVE = "tonight-master/private/song.mp3"


class AudioPreparationError(Exception):
    """A fixed diagnostic code, never source bytes or secret values."""


def contract():
    items = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if not isinstance(items, list):
        raise AudioPreparationError("manifest-invalid")
    music = [item for item in items if isinstance(item, dict)
             and (item.get("id") == "music" or item.get("type") == "audio")]
    if len(music) != 1 or music[0].get("id") != "music" or music[0].get("type") != "audio":
        raise AudioPreparationError("manifest-audio-ambiguous")
    item = music[0]
    # This locator identifies the archived input. It is never our output path,
    # and no plaintext file at that locator is opened or modified here.
    if item.get("localPath") != "public/music.mp3":
        raise AudioPreparationError("manifest-source-locator-invalid")
    expected = item.get("sha256")
    if not isinstance(expected, str) or re.fullmatch(r"[0-9a-f]{64}", expected) is None:
        raise AudioPreparationError("manifest-sha-invalid")
    info = ENCRYPTED.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_size <= 28:
        raise AudioPreparationError("encrypted-input-invalid")
    return expected, info.st_size


def decode_key(value):
    if not isinstance(value, str) or not value:
        raise AudioPreparationError("key-missing-or-invalid")
    value = value.strip()
    try:
        key = base64.b64decode(value, validate=True)
    except (ValueError, TypeError):
        raise AudioPreparationError("key-missing-or-invalid") from None
    if len(key) != 32 or base64.b64encode(key).decode("ascii") != value:
        raise AudioPreparationError("key-missing-or-invalid")
    return key


def decrypt_payload(encrypted: bytes, key: bytes, expected_sha: str) -> bytes:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    if len(encrypted) <= 28:
        raise AudioPreparationError("encrypted-input-invalid")
    nonce, tag, payload = encrypted[:12], encrypted[12:28], encrypted[28:]
    try:
        plaintext = AESGCM(key).decrypt(nonce, payload + tag, None)
    except Exception:
        raise AudioPreparationError("authentication-failed") from None
    if hashlib.sha256(plaintext).hexdigest() != expected_sha:
        raise AudioPreparationError("plaintext-sha-mismatch")
    return plaintext


def remove_private_output(temporary):
    # Best effort for both paths, even when one unlink fails. The caller still
    # exits unsuccessfully and never claims the private output was prepared.
    for path in (temporary, TARGET):
        if path is not None:
            try:
                if path.parent.is_symlink() or not path.parent.resolve().is_relative_to(ROOT):
                    continue
                path.unlink(missing_ok=True)
            except OSError:
                pass


def prepare():
    if os.environ.get("GITHUB_ACTIONS") != "true":
        raise AudioPreparationError("ci-required")
    temporary = None
    completed = False
    try:
        expected_sha, encrypted_size = contract()
        # The key is read only on this CI path, never by --check-contract.
        key = decode_key(os.environ.get("AUDIO_DECRYPTION_KEY"))
        encrypted = ENCRYPTED.read_bytes()
        if len(encrypted) != encrypted_size:
            raise AudioPreparationError("encrypted-input-changed")
        plaintext = decrypt_payload(encrypted, key, expected_sha)
        private = TARGET.parent
        if private.is_symlink() or not private.resolve().is_relative_to(ROOT):
            raise AudioPreparationError("private-directory-invalid")
        private.mkdir(mode=0o700, parents=True, exist_ok=True)
        private.chmod(0o700)
        descriptor, name = tempfile.mkstemp(prefix=".song-", suffix=".tmp", dir=private)
        temporary = Path(name)
        with os.fdopen(descriptor, "wb") as output:
            os.fchmod(output.fileno(), 0o600)
            if output.write(plaintext) != len(plaintext):
                raise AudioPreparationError("private-write-incomplete")
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, TARGET)
        temporary = None
        info = TARGET.stat()
        if not stat.S_ISREG(info.st_mode) or stat.S_IMODE(info.st_mode) != 0o600 or info.st_size != len(plaintext):
            raise AudioPreparationError("private-output-invalid")
        directory = os.open(private, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
        completed = True
        return {"sha256": expected_sha, "bytes": len(plaintext), "target": TARGET_RELATIVE}
    finally:
        if not completed:
            remove_private_output(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-contract", action="store_true")
    arguments = parser.parse_args()
    if arguments.check_contract:
        expected_sha, encrypted_size = contract()
        print(json.dumps({"checkContract": "pass", "expectedSHA256": expected_sha,
                          "expectedBytes": encrypted_size - 28, "target": TARGET_RELATIVE}))
        return 0
    print(json.dumps(prepare()))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AudioPreparationError as error:
        print(f"Audio preparation failed ({error}).", file=sys.stderr)
        raise SystemExit(1) from None
    except KeyboardInterrupt:
        print("Audio preparation interrupted.", file=sys.stderr)
        raise SystemExit(130) from None
    except Exception:
        print("Audio preparation failed (input-or-output-error).", file=sys.stderr)
        raise SystemExit(1) from None
