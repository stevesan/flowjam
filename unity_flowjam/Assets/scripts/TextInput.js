#pragma strict

@script RequireComponent(Connectable)

private var con:Connectable = null;
private var state = "active";
private var input = "";

var typeSound:AudioClip;
var eraseSound:AudioClip;

function Awake()
{
    con = GetComponent(Connectable);
}

function Start()
{

}

function ClearInput()
{
    input = "";
}

function GetInput()
{
    return input;
}

function Update()
{
    if( state == "active" )
    {
        var soundToPlay:AudioClip = null;

        for( var c:char in Input.inputString )
        {
            // Backspace - Remove the last character
            if( c == "\b"[0] )
            {
                if( input.Length != 0 )
                {
                    input = input.Substring(0, input.Length - 1);
                    con.TriggerEvent("OnBackspace");
                    soundToPlay = eraseSound;
                }
                else
                {
                    con.TriggerEvent("OnBackspaceError");
                }
            }
            else if( c == "\n"[0] || c == "\r"[0] ) // "\n" for Mac, "\r" for windows.
            {
                con.TriggerEvent("OnInputEnter");
            }
            else if( c >= "0"[0] && c <= "9"[0] )
            {
                // ignore numbers
            }
            else
            {
                input += c;
                soundToPlay = typeSound;
                con.TriggerEvent("OnInputCharacter");
            }
        }

        if( soundToPlay != null )
            AudioSource.PlayClipAtPoint( soundToPlay, Camera.main.transform.position );
    }
}
