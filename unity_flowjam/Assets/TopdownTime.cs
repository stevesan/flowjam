using UnityEngine;
using System.Collections;

public class TopdownTime : MonoBehaviour {

    public static TopdownTime main;

    bool freeze = false;

    void Awake()
    {
        main = this;
    }

    public void Freeze()
    {
        freeze = true;
    }

    public void Unfreeze()
    {
        freeze = false;
    }

    public float GetDeltaTime()
    {
        if( freeze )
            return 0f;
        else
            return Time.deltaTime;
    }

    public float GetFixedDeltaTime()
    {
        if( freeze )
            return 0f;
        else
            return Time.fixedDeltaTime;
    }

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}
}
