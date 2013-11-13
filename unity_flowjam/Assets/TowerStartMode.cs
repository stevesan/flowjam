using UnityEngine;
using System.Collections;

public class TowerStartMode : MonoBehaviour {

    public TowerPlayMode playMode;

	// Use this for initialization
	void Start ()
    {
        playMode.gameObject.SetActive(false);
	}
	
	// Update is called once per frame
	void Update()
    {
        if( RhymeScorer.main.GetIsReady() )
        {
            gameObject.SetActive(false);
            playMode.gameObject.SetActive(true);
        }
	}
}
