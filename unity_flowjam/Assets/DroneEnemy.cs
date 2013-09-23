using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class DroneEnemy : MonoBehaviour {

    public float speed;
    public bool moveTowardsPlayer;

    TopdownMover mover;
    TopdownPlayer player;
    TopdownGame game;
    bool playerHasSeen = false;

    HashSet<Attackable> parts = new HashSet<Attackable>();

	// Use this for initialization
	void Start()
    {
        mover = GetComponent<TopdownMover>();
        Utility.Assert( mover != null );

        game = Utility.FindAncestor<TopdownGame>(gameObject);
        Utility.Assert( game != null );

        player = game.GetPlayer();
        Utility.Assert( player != null );

        foreach( Attackable part in gameObject.GetComponentsInChildren<Attackable>() )
        {
            parts.Add(part);
            part.dieEvent.AddHandler(gameObject, OnPartDie);
        }
	}

    void OnPartDie( GameObject partObj )
    {
        parts.Remove( partObj.GetComponent<Attackable>() );
        if( parts.Count == 0 )
            Destroy(gameObject);
    }
	
	// Update is called once per frame
	void Update()
    {
        if( moveTowardsPlayer && playerHasSeen )
        {
            Vector3 move = player.transform.position - transform.position;
            mover.SetMove(move.normalized);
        }
        else
        {
            mover.SetMove(Vector3.zero);
        }
	}

    void OnEnterPlayerVisibility( PlayerVisibility vis )
    {
        playerHasSeen = true;
    }
}
