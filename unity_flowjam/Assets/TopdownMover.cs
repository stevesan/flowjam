using UnityEngine;
using System.Collections;

public class TopdownMover : MonoBehaviour
{
    public float fullSpeed = 100f;
    public float activeMaxAccel = 300f;
    public float passiveMaxAccel = 100f;

    Vector3 move = Vector3.zero;

	// Use this for initialization
	void Start()
    {
	}

    //----------------------------------------
    //  'move' is not necessarily normalized. Ex. If the magnitude if 0.5, we will move at half speed.
    //----------------------------------------
    public void SetMove( Vector3 move )
    {
        this.move = move;
    }

    void Update()
    {
    }
	
	// Update is called once per frame
	void FixedUpdate()
    {
        Vector3 targetVelocity = move * fullSpeed;
        Vector3 deltaVel = targetVelocity - rigidbody.velocity;
        float maxAccel = (move.magnitude > 0 ? activeMaxAccel : passiveMaxAccel);
        Vector3 accel = Vector3.ClampMagnitude( deltaVel/Time.fixedDeltaTime, maxAccel );
        rigidbody.AddForce( accel, ForceMode.Acceleration );
	}
}
