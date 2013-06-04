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
    var clip = null;

    for( var i = 0; i < moveClips.length; i++ )
    {
        if( i >= 1 && ClimberGame.main.GetLastScore() <= i )
        {
            break;
        }
        clip = moveClips[i];
    }

    if( clip != null )
        AudioSource.PlayClipAtPoint( clip, ClimberGuy.main.transform.position );
}

function Update () {

}
