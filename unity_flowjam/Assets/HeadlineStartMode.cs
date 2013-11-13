using UnityEngine;
using System.Collections;

public class HeadlineStartMode : MonoBehaviour {

    public GameObject postLoadMode;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update()
    {
        if( RhymeScorer.main.GetIsReady() )
        {
            gameObject.SetActive(false);
            postLoadMode.SetActive(true);
        }
	}
}
