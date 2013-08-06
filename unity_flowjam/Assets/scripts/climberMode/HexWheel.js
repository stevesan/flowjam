#pragma strict

//----------------------------------------
//  The 1-6 keys that show around the player
//----------------------------------------

var numberPrefab:GameObject;
var color = Color.white;
var offsetPixels = Vector2(0,50);

var hidden = -1;

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

            if( k != hidden
                    && WordSpawner.main.GetEntry( nbor.i, nbor.j ) != null )
            {
                var wsPos = ClimberGrid.mainTiler.GetGlobalPosition( nbor.i, nbor.j );
                var gsOffset = offsetPixels;
                gsOffset.x /= Screen.width;
                gsOffset.y /= Screen.height;
                numbers[k].transform.position = Utils.WorldToGUIPoint(wsPos)
                    + Utils.PixelsToGUIOffset(offsetPixels);
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
