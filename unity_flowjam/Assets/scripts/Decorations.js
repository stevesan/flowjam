#pragma strict

var numCubesH = 15;
var numCubesV = 10;
var cubeStep = 0.25;
var cubePrefab:GameObject;

function Start()
{
    var pos = cubePrefab.transform.position;

    for( var i = 0; i < numCubesV; i++ )
    {
        pos.x = cubePrefab.transform.position.x;

        for( var j = 0; j < numCubesH; j++ )
        {
            if( i == 0
                    || i == (numCubesV-1)
                    || j == 0
                    || j == (numCubesH-1) )
            {

                var inst = Instantiate( cubePrefab, pos, cubePrefab.transform.rotation );
                inst.transform.parent = transform;
            }
            pos.x += cubeStep;
        }

        pos.y += cubeStep;
    }

    Destroy(cubePrefab);

}

function Update () {

}
