﻿using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class BlastRadius : MonoBehaviour
{
    HashSet<Attackable> activeTargets = new HashSet<Attackable>();

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

    void OnTriggerEnter(Collider other)
    {
        Attackable target = Utility.FindAncestor<Attackable>(other.gameObject);
        if( target != null )
        {
            target.SendMessage("OnEnterBlastRadius", this, SendMessageOptions.DontRequireReceiver);
            activeTargets.Add(target);
        }
    }

    void OnTriggerExit(Collider other)
    {
        Attackable target = Utility.FindAncestor<Attackable>(other.gameObject);
        if( target != null )
        {
            target.SendMessage("OnExitBlastRadius", this, SendMessageOptions.DontRequireReceiver);
            activeTargets.Remove(target);
        }
    }

    public HashSet<Attackable> GetActiveTargets()
    {
        return activeTargets;
    }
}
