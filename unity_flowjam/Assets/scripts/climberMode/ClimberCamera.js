#pragma strict

public static var main:ClimberCamera;

var offset = Vector3.zero;
var smoothTime = 0.5f;

private var follow = true;
private var dampVelocity:Vector3;

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
        var origZ = transform.position.z;
        var targetPos = ClimberGuy.main.transform.position + offset;
        transform.position = Vector3.SmoothDamp( transform.position, targetPos, dampVelocity, smoothTime );
        transform.position.z = origZ;
    }
}
