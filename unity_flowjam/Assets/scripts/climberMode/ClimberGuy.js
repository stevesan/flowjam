#pragma strict

var moveSpeed = 1.0;

private var moveStartPos:Vector3;
private var moveStartTime:float;
private var moveDir:Vector3;
private var moveDistance = 0.0f;

function Start ()
{
    moveStartPos = transform.position;
    moveDistance = 0.0;

}

function DoMove( dir:Vector3, distance:float )
{
    moveStartPos = transform.position;
    moveStartTime = Time.time;
    moveDir = dir;
    moveDistance = distance;
}

function Update()
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
