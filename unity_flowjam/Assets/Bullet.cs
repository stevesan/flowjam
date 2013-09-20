
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class Bullet : MonoBehaviour
{
    public float speed = 10f;
    public float hitRadius = 1f;
    Vector3 dir = Vector3.zero;

    public void SetDirection(Vector3 dir)
    {
        this.dir = dir;
    }

    void Update()
    {
        transform.position += dir * speed * Time.deltaTime;

        foreach( Collider other in Physics.OverlapSphere( transform.position, hitRadius ) )
        {
            TopdownPlayer player = Utility.FindAncestor<TopdownPlayer>(other.gameObject);
            if( player != null )
                continue;

            Attackable target = Utility.FindAncestor<Attackable>(other.gameObject);
            if( target != null )
            {
                target.OnDamaged();
            }

            Destroy(gameObject);
        }
    }
}
