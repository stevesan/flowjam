#pragma strict

static var main:ClimberGuy = null;

var moveSpeed = 1.0;
var initRow = 3;
var initCol = 5;
var defaultGripSecs = 5.0;
var gripSecsDisplayPrefab:GameObject;

private var origPos:Vector3;
private var moveStartPos:Vector3;
private var moveStartTime:float;
private var moveDir:Vector3;
private var moveDistance = 0.0f;

private var currRow = 0;
private var currCol = 0;
private var state = "idle";
private var gripSecsDisplay:GameObject;
private var gripSecs = 0.0;

function GetRow() { return currRow; }
function GetCol() { return currCol; }

function GetHexes()
{
    return ClimberGrid.mainTiler;
}

function Awake()
{
    Utils.Assert(main == null);
    main = this;
    origPos = transform.position;
    gripSecsDisplay = Utils.SpawnFromPrefab( gripSecsDisplayPrefab );

    MoveTo( initRow, initCol, 0, true );
}

function MoveTo( i:int, j:int, gripBonus:float, teleport:boolean )
{
    currRow = i;
    currCol = j;

    var goalPos = GetHexes().GetGlobalPosition( i, j );
    goalPos.z = origPos.z;
    var delta = goalPos - transform.position;

    if( teleport || delta.magnitude <= 0 )
    {
        transform.position = goalPos;
        state = "idle";
    }
    else
    {
        moveStartPos = transform.position;
        moveStartTime = Time.time;
        moveDir = delta.normalized;
        moveDistance = delta.magnitude;
        state = "moving";
    }

    gripSecs = defaultGripSecs + gripBonus;
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
    MoveTo( initRow, initCol, 0, true );
}

function OnGameOver()
{
    state = "idle";
}

function OnMoveEnd()
{
    if( state == "moving" )
    {
        state = "idle";
        GetComponent(Connectable).TriggerEvent("OnMoveEnd");
    }
}

function Update()
{
    if( ClimberGame.main.GetIsPlaying() )
    {
        if( state == "moving" )
        {
            var moveDuration = moveDistance / moveSpeed;

            if( (moveStartTime + moveDuration) > Time.time )
                transform.position += moveDir * moveSpeed * Time.deltaTime;
            else
            {
                transform.position = moveStartPos + moveDir*moveDistance;
                OnMoveEnd();
            }
        }
        else if( state == "idle" )
        {
            gripSecs -= Time.deltaTime;
        }

        gripSecsDisplay.GetComponent(GUIText).text = gripSecs.ToString("0.0");
        gripSecsDisplay.transform.position = Utils.WorldToGUIPoint(transform.position);
    }
    else
    {
        gripSecsDisplay.GetComponent(GUIText).text = "";
    }

}
