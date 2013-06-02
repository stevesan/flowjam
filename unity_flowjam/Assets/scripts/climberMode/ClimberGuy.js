#pragma strict

static var main:ClimberGuy = null;

var moveSpeed = 1.0;

private var origPos:Vector3;
private var moveStartPos:Vector3;
private var moveStartTime:float;
private var moveDir:Vector3;
private var moveDistance = 0.0f;

function Awake()
{
    Utils.Assert(main == null);
    main = this;
    origPos = transform.position;
}

function DoMove( dir:Vector3, distance:float )
{
    moveStartPos = transform.position;
    moveStartTime = Time.time;
    moveDir = dir;
    moveDistance = distance;
}

function OnGameStart()
{
    transform.position = origPos;
    moveStartPos = transform.position;
    moveDistance = 0.0;
}

function OnGameOver()
{
}

function Update()
{
    if( ClimberGame.main.GetIsPlaying() )
    {
        var moveDuration = moveDistance / moveSpeed;

        if( (moveStartTime + moveDuration) > Time.time )
        {
            transform.position += moveDir * moveSpeed * Time.deltaTime;
        }
        else
        {
            transform.position = moveStartPos + moveDir*moveDistance;
        }
    }

}
