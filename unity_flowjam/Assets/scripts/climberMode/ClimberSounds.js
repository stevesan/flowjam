#pragma strict

var playerDropClip:AudioClip;
var playerDieClip:AudioClip;

function Awake()
{
}

function Start()
{
    var con = ClimberGame.main.GetComponent(Connectable);
    con.AddListener( this.gameObject, "OnPlayerDrop" );
    con.AddListener( this.gameObject, "OnPlayerDie" );
}

function OnPlayerDrop()
{
    AudioSource.PlayClipAtPoint(
            playerDropClip,
            ClimberGuy.main.transform.position );
}

function OnPlayerDie()
{
    AudioSource.PlayClipAtPoint(
            playerDieClip,
            ClimberGuy.main.transform.position );
}

function Update () {

}
