using UnityEngine;
using System.Collections;

public class TopdownPlayer : MonoBehaviour
{
    public float fullSpeed = 100f;
    public float activeMaxAccel = 300f;
    public float passiveMaxAccel = 100f;
    public bool respondToInput = true;

    Vector3 inputDir = Vector3.zero;

	// Use this for initialization
	void Start()
    {
	}

    void Update()
    {
        inputDir = Vector3.zero;

        if( respondToInput )
        {
            if( Input.GetKey("e") )
                inputDir += new Vector3(0,0,1);
            if( Input.GetKey("d") )
                inputDir += new Vector3(0,0,-1);
            if( Input.GetKey("s") )
                inputDir += new Vector3(-1,0,0);
            if( Input.GetKey("f") )
                inputDir += new Vector3(1,0,0);
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
}
