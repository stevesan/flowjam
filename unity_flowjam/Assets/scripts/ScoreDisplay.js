#pragma strict

var text:GUIText;

private var scoreFlicker = new SlicedAnimation();

function Awake()
{
}

function Start()
{
    scoreFlicker.Play();

    GameController.instance.GetComponent(Connectable).AddListener( this.gameObject, "OnRhymeSuccess" );
    GameController.instance.GetComponent(Connectable).AddListener( this.gameObject, "OnRoundStart" );
}

function OnRoundStart(game:GameObject)
{
    text.text = 'SCORE: 0';
}

function OnRhymeSuccess(game:GameObject)
{
    text.text = 'SCORE: ' + game.GetComponent(GameController).GetScore();
    text.GetComponent(CameraShake).Play();
}

function Update()
{
    transform.position.x = 0.5 + Mathf.Sin(2*Mathf.PI*1.0*Time.time)*0.010;

    scoreFlicker.BeginUpdate();
    if( scoreFlicker.CheckSlice(0.5) )
    {
        if( scoreFlicker.JustStartedSlice() )
            text.material.color = Color(1.0, 0.0, 0.0, 1.0) + Utils.RandomColor();
        text.material.color.a = 1.0-scoreFlicker.GetSliceFraction()*0.2;
    }
    else
        // loop
        scoreFlicker.Play();
    scoreFlicker.EndUpdate();

}
