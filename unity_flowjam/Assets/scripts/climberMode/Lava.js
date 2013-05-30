#pragma strict

var speed = 0.5;

private var state = "idle";

private var origPos:Vector3;

function Start ()
{
    origPos = transform.position;
}

function OnGameStart()
{
    transform.position = origPos;
    state = "active";
}

function OnGameOver()
{
    state = "idle";
}

function Update ()
{
    if( state == "active" )
    {
        transform.position.y += speed * Time.deltaTime;
    }
}
