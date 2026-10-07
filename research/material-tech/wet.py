sky((1,.98,.89),(.035,.13,.19),.55)
wet=mat('Wet rippled reflective stone',(.018,.045,.045),.13,.45,bump=.12);glass=mat('Frosted lens crossing shard',(.47,.78,.78),.18,0,.83);metal=mat('Enormous submerged monument',(.022,.029,.027),.55,.62,bump=.25)
body('Wet surface under camera',(0,16,-.28),(120,180,.5),wet,0)
curve('Impossible monument cross section',[(-9,24,0),(-9,24,22),(3,26,29),(8,24,16),(6,24,3)],1.6,metal)
near=body('Nearby cut refractive pane',(-3,-3,3),(.13,2,7),glass,.08);near.rotation_euler[1]=-.4
for i in range(22):sphere('Wet micro bead',(rng.uniform(-12,12),rng.uniform(-15,20),.02),(.08,.08,.03),glass,2)
light('Hard silhouette backlight',(2,28,19),48000,6,(1,.85,.63),(0,13,0));light('Reflected cool strip',(-16,6,5),12000,7,(.28,.7,.74),(0,8,0));fog(.0015)
def animate(q):look((-5+q*8,-13+q*12,.3),(0,14,1.4),26,.02-q*.08,6);near.location.y=-3-q*8
