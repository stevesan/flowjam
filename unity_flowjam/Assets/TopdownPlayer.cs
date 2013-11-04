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
    public MeshRenderer renderer;

    bool isDead = false;

    float graceTime = 0f;
    int health;

    Vector3 inputDir = Vector3.zero;
    PlayerVisibility visibility;

	// Use this for initialization
	void Start()
    {
        visibility = gameObject.GetComponentInChildren<PlayerVisibility>();
        health = initHealth;
	}

    public int GetHealth() { return health; }

    void Update()
    {
        inputDir = Vector3.zero;

        if( respondToInput && !isDead )
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

        if( graceTime > 0 )
        {
            renderer.enabled =
                Mathf.FloorToInt(graceTime/0.1f) % 2 == 0;
        }
        else
        {
            renderer.enabled = true;
        }
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

    public PlayerVisibility GetVisibility()
    {
        return visibility;
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

            if( health == 0 )
            {
                isDead = true;
            }
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
