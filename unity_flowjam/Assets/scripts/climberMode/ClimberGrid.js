#pragma strict

public static var main:ClimberGrid;
public static var mainTiler:HexTiler;

function Awake()
{
    Utils.Assert( main == null );
    main = this;
    mainTiler = GetComponent(HexTiler);
}

function Start()
{

}

function Update()
{

}
