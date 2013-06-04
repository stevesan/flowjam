#pragma strict

var playerDropClip:AudioClip;
var playerDieClip:AudioClip;
var moveClips:AudioClip[];

function Awake()
{
}

function Start()
{
    var con = ClimberGame.main.GetComponent(Connectable);
    con.AddListener( this.gameObject, "OnPlayerDrop" );
    con.AddListener( this.gameObject, "OnPlayerDie" );
    con.AddListener( this.gameObject, "OnPlayerMove" );
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

function OnPlayerMove()
{
    var index = Mathf.Clamp(
            Mathf.Ceil( ClimberGame.main.GetLastScore() ) -1,
            0, moveClips.length-1 );
    var clip = moveClips[ index ];

    AudioSource.PlayClipAtPoint( clip, ClimberGuy.main.transform.position );
}

function Update () {

}
