#pragma strict

var speed = 0.5;

private var state = "idle";

private var origPos:Vector3;

function Start()
{
    origPos = transform.position;
}

function Disable()
{
    state = "disabled";
    gameObject.SetActive(false);
}

function OnGameStart()
{
    transform.position = origPos;
    state = "active";
    gameObject.SetActive(true);
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
