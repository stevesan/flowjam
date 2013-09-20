using UnityEngine;
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
            target.OnEnterBlastRadius(this);
            activeTargets.Add(target);
        }
    }

    void OnTriggerExit(Collider other)
    {
        Attackable target = Utility.FindAncestor<Attackable>(other.gameObject);
        if( target != null )
        {
            target.OnExitBlastRadius(this);
            activeTargets.Remove(target);
        }
    }

    public HashSet<Attackable> GetActiveTargets()
    {
        return activeTargets;
    }
}
