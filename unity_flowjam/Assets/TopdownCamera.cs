using UnityEngine;
using System.Collections;
using SteveSharp;

public class TopdownCamera : MonoBehaviour
{
    public Transform target;
    public float smoothTime = 0.5f;

    public GameEvent lateUpdateDone = new GameEvent();

    Vector3 followVelocity = Vector3.zero;
    Vector3 offset;

	// Use this for initialization
	void Start()
    {
        offset = transform.position - target.position;
	}
	
	// Update is called once per frame
	void LateUpdate()
    {
        transform.position = Vector3.SmoothDamp( transform.position, target.position+offset, ref followVelocity, smoothTime );
        lateUpdateDone.Trigger(gameObject);
	}
}
