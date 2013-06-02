#pragma strict

var yOffset = 5.0f;

function Start () {

}

function LateUpdate () {

    transform.position.y = ClimberGuy.main.transform.position.y + yOffset;

}
