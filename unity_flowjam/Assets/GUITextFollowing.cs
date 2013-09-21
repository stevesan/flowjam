using UnityEngine;
using System.Collections;

public class GUITextFollowing : MonoBehaviour
{
    public Transform target;
    public Vector3 viewportOffset;
    public TopdownCamera camera;
    public float smoothTime = 0.1f;

    Vector3 wsPos;
    Vector3 dampVelocity;
 
	// Use this for initialization
	void Start()
    {
        if( camera == null )
            camera = Camera.main.GetComponent<TopdownCamera>();

        camera.lateUpdateDone.AddHandler( gameObject, UpdatePosition );
        wsPos = camera.camera.WorldToViewportPoint( target.position );
	}
	
	void UpdatePosition(GameObject camera)
    {
        // Do the damping in world space. For some reason..
        wsPos = Vector3.SmoothDamp( wsPos, target.position, ref dampVelocity, smoothTime );
        Vector3 vsPos = camera.camera.WorldToViewportPoint( wsPos ) + viewportOffset;
        transform.position = vsPos;

        gameObject.BroadcastMessage("GUITextPositionChangedLate", SendMessageOptions.DontRequireReceiver );
	}
}
