#pragma strict

var scaleAnim = new ParameterAnimation();

function Awake()
{
    scaleAnim.Awake();
}

function Start()
{
    GameController.instance.GetComponent(Connectable).AddListener( this.gameObject, "OnRhymeSuccess" );
}

function OnRhymeSuccess(game:GameObject)
{
    scaleAnim.Play();
}

function Update()
{
    scaleAnim.Update();

    if( scaleAnim.IsPlaying() )
    {
        var f = scaleAnim.GetFraction();
        // decaying sine wave
        var s = 1.0 + 0.8*Mathf.Sin( 2*Mathf.PI*3.0 * f ) * Mathf.Exp(-3.0*f);
        transform.localScale = Vector3(s,s,s);
    }
    else
    {
        transform.localScale = Vector3(1,1,1);
    }
    

}
