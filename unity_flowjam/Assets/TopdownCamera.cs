using UnityEngine;
using System.Collections;
using SteveSharp;

public class TopdownCamera : MonoBehaviour
{
    public Transform target;
    public float smoothTime = 0.5f;

    public GameEvent lateUpdateDone = new GameEvent();

    Vector3 followVelocity = Vector3.zero;

	// Use this for initialization
	void Start()
    {
	
	}
	
	// Update is called once per frame
	void LateUpdate()
    {
        Vector3 p = transform.position;
        float origY = p.y;
        p = Vector3.SmoothDamp( p, target.position, ref followVelocity, smoothTime );
        p.y = origY;
        transform.position = p;

        lateUpdateDone.Trigger(gameObject);
	}
}
