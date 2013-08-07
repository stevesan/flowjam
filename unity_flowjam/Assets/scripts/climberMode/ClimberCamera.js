#pragma strict

public static var main:ClimberCamera;

var yOffset = 5.0f;

private var follow = true;

function Awake()
{
    Utils.Assert( main == null );
    main = this;
}

function SetFollow(val)
{
    follow = val;
}

function Start () {

}

function Update()
{
    if( follow )
    {
        transform.position.x = ClimberGuy.main.transform.position.x;
        transform.position.y = ClimberGuy.main.transform.position.y;
        transform.position.y += yOffset;
    }
}
