using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class DroneEnemy : MonoBehaviour
{
    public bool moveTowardsPlayer;

    float antiCrowdingCheckRadius = 10f;
    float antiCrowdingMoveWeight = 1f;

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
        Vector3 toPlayerMove = Vector3.zero;

        if( moveTowardsPlayer && playerHasSeen )
        {
            toPlayerMove = (player.transform.position - transform.position).normalized;
        }

        // Avoid others
        Vector3 antiCrowdingMove = Vector3.zero;

        foreach( Collider col in Physics.OverlapSphere( transform.position, antiCrowdingCheckRadius ) )
        {
            DroneEnemy otherEnemy = Utility.FindAncestor<DroneEnemy>(col.gameObject);

            if( otherEnemy != null && otherEnemy != this && Vector3.Distance(col.gameObject.transform.position, transform.position) < antiCrowdingCheckRadius)
            {
                Vector3 away = transform.position - col.transform.position;
                float weight = Mathf.Pow( 1 - (away.magnitude / antiCrowdingCheckRadius), 1f );
                Utils.Assert( weight >= 0f );
                antiCrowdingMove += away.normalized * weight;
                Debug.DrawLine( transform.position, col.transform.position, Color.red );
            }
        }

        mover.SetMove( (toPlayerMove + antiCrowdingMoveWeight*antiCrowdingMove.normalized).normalized );
	}

    void OnEnterPlayerVisibility( PlayerVisibility vis )
    {
        playerHasSeen = true;
    }
}
