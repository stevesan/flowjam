#pragma strict

var speed = 0.5;

function Start ()
{

}

function Update ()
{

    transform.position.y += speed * Time.deltaTime;

}
