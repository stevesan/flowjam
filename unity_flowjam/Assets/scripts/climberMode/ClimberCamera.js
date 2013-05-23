#pragma strict

var climber:Transform;

var yOffset = 5.0f;

function Start () {

}

function Update () {

    transform.position.y = climber.position.y + yOffset;

}
