#pragma strict

function Start () {

}

function Update () {

}

function OnTriggerEnter(other:Collider)
{
    Debug.Log("triger hit");
    var climber = other.gameObject.GetComponent(ClimberGuy);

    if( climber )
    {
        ClimberGame.main.OnHitKillZone();
    }
}

