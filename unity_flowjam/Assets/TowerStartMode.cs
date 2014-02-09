using UnityEngine;
using System.Collections;

public class TowerStartMode : MonoBehaviour
{
    public TowerPlayMode playMode;
    public GUIText menuText;

    string state = "loading";

	// Use this for initialization
	void Start ()
    {
        state = "loading";
        playMode.gameObject.SetActive(false);
	}

    void ToPlayMode()
    {
        gameObject.SetActive(false);
        playMode.gameObject.SetActive(true);
    }
	
	// Update is called once per frame
	void Update()
    {
        if( state == "loading" )
        {
            menuText.text = "Loading..";

            if( RhymeScorer.main.GetIsReady() )
            {
                state = "difficulty";
            }
        }
        else if( state == "difficulty" )
        {
            menuText.text = "Press # to choose difficulty\n1. Normal\n2. Timed\n3. Hard\n4. Hard Timed";

            if( Input.GetKeyDown("1") )
            {
                playMode.difficulty = 0;
                playMode.timedAdd = false;
                playMode.addPerTurn = true;
                playMode.addExtraLetters = true;
                ToPlayMode();
            }
            else if( Input.GetKeyDown("2") )
            {
                playMode.difficulty = 0;
                playMode.timedAdd = true;
                playMode.addPerTurn = false;
                playMode.addExtraLetters = true;
                ToPlayMode();
            }
            else if( Input.GetKeyDown("3") )
            {
                playMode.difficulty = 1;
                playMode.timedAdd = false;
                playMode.addPerTurn = true;
                playMode.addExtraLetters = true;
                ToPlayMode();
            }
            else if( Input.GetKeyDown("4") )
            {
                playMode.difficulty = 1;
                playMode.timedAdd = true;
                playMode.addPerTurn = false;
                playMode.addExtraLetters = true;
                ToPlayMode();
            }
        }
	}
}
