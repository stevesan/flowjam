using UnityEngine;
using System.Collections;
using SteveSharp;

public class TopdownPlayer : MonoBehaviour
{
    public float fullSpeed = 100f;
    public float activeMaxAccel = 300f;
    public float passiveMaxAccel = 100f;
    public bool respondToInput = true;
    public int initHealth = 5;
    public AudioClip hurtClip;
    public GameObject hurtFx;
    public AudioClip healClip;
    public GameObject healFx;

    float graceTime = 0f;
    int health;

    Vector3 inputDir = Vector3.zero;
    BlastRadius blastRadius;

	// Use this for initialization
	void Start()
    {
        blastRadius = gameObject.GetComponentInChildren<BlastRadius>();
        health = initHealth;
	}

    public int GetHealth() { return health; }

    void Update()
    {
        inputDir = Vector3.zero;

        if( respondToInput )
        {
            if( Input.GetKey("w") )
                inputDir += new Vector3(0,0,1);
            if( Input.GetKey("s") )
                inputDir += new Vector3(0,0,-1);
            if( Input.GetKey("a") )
                inputDir += new Vector3(-1,0,0);
            if( Input.GetKey("d") )
                inputDir += new Vector3(1,0,0);
        }

        graceTime -= Time.deltaTime;
    }
	
	// Update is called once per frame
	void FixedUpdate()
    {
        Vector3 targetVelocity = inputDir.normalized * fullSpeed;
        Vector3 deltaVel = targetVelocity - rigidbody.velocity;
        float maxAccel = (inputDir.magnitude > 0 ? activeMaxAccel : passiveMaxAccel);
        Vector3 accel = Vector3.ClampMagnitude( deltaVel/Time.fixedDeltaTime, maxAccel );
        rigidbody.AddForce( accel, ForceMode.Acceleration );
	}

    public BlastRadius GetBlastRadius()
    {
        return blastRadius;
    }

    void OnCollision( Collision col )
    {
        DroneEnemy enemy = Utility.FindAncestor<DroneEnemy>(col.gameObject);

        if( enemy != null && graceTime < 0f )
        {
            health--;
            graceTime = 2f;
            AudioSource.PlayClipAtPoint( hurtClip, transform.position );
            Utility.Instantiate(hurtFx, transform.position);
            return;
        }

        HealthPotion hp = Utility.FindAncestor<HealthPotion>(col.gameObject);
        if( hp != null )
        {
            AudioSource.PlayClipAtPoint( healClip, transform.position );
            Utility.Instantiate(healFx, transform.position);
            health += hp.amount;
            hp.OnConsumed();
        }
    }

    public void OnCollisionEnter( Collision col ) { OnCollision( col ); }
    public void OnCollisionStay( Collision col ) { OnCollision( col ); }
}
