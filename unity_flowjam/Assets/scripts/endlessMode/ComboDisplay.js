#pragma strict

var text:GUIText;

function Awake()
{
    if( text == null )
        text = GetComponent(GUIText);
}

function Start()
{
    EndlessGame.instance.GetComponent(Connectable).AddListener( this.gameObject, "OnRhymeSuccess" );
    EndlessGame.instance.GetComponent(Connectable).AddListener( this.gameObject, "OnRhymeFail" );
    EndlessGame.instance.GetComponent(Connectable).AddListener( this.gameObject, "OnComboBreak" );
    EndlessGame.instance.GetComponent(Connectable).AddListener( this.gameObject, "OnRoundStart" );
}

private function UpdateText()
{
    var comboCount = EndlessGame.instance.GetComboCount();

    if( comboCount < 2 )
    {
        text.text = 'NO COMBO';
        text.material.color = Color(0.5, 0.5, 0.5, 1.0);
    }
    else
    {
        text.text = 'COMBO x'+comboCount;

        var c:Color;
        if( comboCount == 2 )
            c = Color(0, 0, 1, 1);
        else if( comboCount == 3 )
            c = Color(0, 1, 0, 1);
        else 
            c = Color(1, 0.8, 0, 1 );
        text.material.color = c;
    }
}

function OnRoundStart(game:GameObject)
{
    Debug.Log("called");
    UpdateText();
}

function OnRhymeSuccess(game:GameObject)
{
    UpdateText();
    text.GetComponent(CameraShake).Play();
}

function OnRhymeFail(game:GameObject)
{
    UpdateText();
}

function OnComboBreak(game:GameObject)
{
    text.GetComponent(CameraShake).Play();
}

function Update () {

}
