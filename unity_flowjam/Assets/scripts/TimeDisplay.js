#pragma strict

var roundSecs = 30.0;

private var roundStartTime:float;
private var text:GUIText;

function Awake()
{
    text = GetComponent(GUIText);
}

function Start ()
{
    roundStartTime = Time.time;
}

function Update ()
{
    var elapsed = (Time.time-roundStartTime);
    var left = roundSecs - elapsed;
    var fraction = elapsed / roundSecs;
    
    text.text = left.ToString('00.00');
    text.material.color = Color(1.0, (1-fraction), (1-fraction), 1.0);

}
