#pragma strict

//----------------------------------------
//  The 1-6 keys that show around the player
//----------------------------------------

var numberPrefab:GameObject;
var color = Color.white;
var gsOffset = Vector3(0,0.3,0);

private var numbers = new List.<GameObject>();

function Start()
{
    for( var i = 0; i < 6; i++ )
    {
        numbers.Add( Utils.SpawnFromPrefab(numberPrefab) );
        numbers[i].GetComponent(GUIText).text = ""+(i+1);
        numbers[i].GetComponent(GUIText).material.color = color;
    }
}

function LateUpdate()
{
    if( ClimberGame.main.GetIsPlaying() )
    {
        var i = ClimberGuy.main.GetRow();
        var j = ClimberGuy.main.GetCol();

        for( var k = 0; k < 6; k++ )
        {
            var nbor = HexTiler.GetNbor( i, j, k );

            if( WordSpawner.main.GetEntry( nbor.i, nbor.j ) != null )
            {
                var wsPos = ClimberGrid.mainTiler.GetGlobalPosition( nbor.i, nbor.j );
                numbers[k].transform.position = Utils.WorldToGUIPoint(wsPos) + gsOffset;
                numbers[k].SetActive(true);
            }
            else
                numbers[k].SetActive(false);
        }
    }
    else
    {
        for( k = 0; k < 6; k++ )
            numbers[k].SetActive(false);
    }
}
