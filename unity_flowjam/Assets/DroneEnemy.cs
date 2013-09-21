using UnityEngine;
using System.Collections;
using SteveSharp;

public class DroneEnemy : MonoBehaviour {

    public float speed;
    public bool moveTowardsPlayer;

    TopdownMover mover;
    TopdownPlayer player;
    TopdownGame game;

	// Use this for initialization
	void Start()
    {
        mover = GetComponent<TopdownMover>();
        Utility.Assert( mover != null );

        game = Utility.FindAncestor<TopdownGame>(gameObject);
        Utility.Assert( game != null );

        player = game.GetPlayer();
        Utility.Assert( player != null );
	}
	
	// Update is called once per frame
	void Update()
    {
        if( moveTowardsPlayer && Utility.CanSee<TopdownPlayer>(player, transform.position) )
        {
            Vector3 move = player.transform.position - transform.position;
            mover.SetMove(move.normalized);
        }
	}
}
