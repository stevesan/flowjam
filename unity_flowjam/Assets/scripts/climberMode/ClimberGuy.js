#pragma strict

static var main:ClimberGuy = null;

var moveSpeed = 1.0;
var initRow = 3;
var initCol = 5;
var defaultGripSecs = 5.0;
var gripSecsDisplayPrefab:GameObject;
var gripSecsDisplayOffset = Vector3(0, -0.01, 0);

private var origPos:Vector3;
private var moveStartPos:Vector3;
private var moveStartTime:float;
private var moveDir:Vector3;
private var moveDistance = 0.0f;
private var wsGoalPos:Vector3;

private var currRow = 0;
private var currCol = 0;
private var state = "idle";
private var gripSecsDisplay:GameObject;
private var gripSecs = 0.0;
private var showGripSecs = true;

function GetRow() { return currRow; }
function GetCol() { return currCol; }

function SetShowGripSecs(val)
{
    showGripSecs = val;
}

function GetHexes()
{
    return ClimberGrid.mainTiler;
}

function GetGripSecs()
{
    return gripSecs;
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

    wsGoalPos = GetHexes().GetGlobalPosition( i, j );
    wsGoalPos.z = origPos.z;

    if( teleport )
    {
        transform.position = wsGoalPos;
        state = "idle";
    }
    else
    {
        state = "moving";
        SendMessage("OnMoveBegin");
    }

    gripSecs = defaultGripSecs + gripBonus;
}

function OnGameStart()
{
    MoveTo( initRow, initCol, 0, true );
    showGripSecs = true;
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
        SendMessage("OnMoveEnd");
    }
}

function Update()
{
    if( ClimberGame.main.GetIsPlaying() )
    {
        if( state == "moving" )
        {
            var maxDist = moveSpeed * Time.deltaTime;
            var delta = wsGoalPos - transform.position;
            transform.position += Vector3.ClampMagnitude( delta, maxDist );
            if( delta.magnitude < maxDist )
            {
                transform.position = wsGoalPos;
                OnMoveEnd();
            }
        }
        else if( state == "idle" )
            gripSecs -= Time.deltaTime;

        if( showGripSecs )
        {
            gripSecsDisplay.GetComponent(GUIText).text = gripSecs.ToString("0.0");
            gripSecsDisplay.transform.position = Utils.WorldToGUIPoint(transform.position) + gripSecsDisplayOffset;
        }
        else
            gripSecsDisplay.GetComponent(GUIText).text = "";
    }
    else
    {
        gripSecsDisplay.GetComponent(GUIText).text = "";
    }

}
