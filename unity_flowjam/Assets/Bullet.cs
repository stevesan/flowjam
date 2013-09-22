
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class Bullet : MonoBehaviour
{
    public float speed = 10f;
    public float hitRadius = 1f;
    public AudioClip dudClip;
    public GameObject dudFx;
    public GameObject hitFx;

    Vector3 dir = Vector3.zero;
    string word;
    TopdownGame game;


    public void Init(Vector3 dir, string word, TopdownGame game)
    {
        this.dir = dir;
        this.word = word;
        this.game = game;
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
            if( target != null && game.IsEffectiveAgainst(word, target.GetWord()) )
            {
                target.OnDamaged();
                Utility.Instantiate(hitFx, transform.position);
            }
            else
            {
                AudioSource.PlayClipAtPoint( dudClip, transform.position );
                Utility.Instantiate(dudFx, transform.position);
            }

            Destroy(gameObject);
        }
    }
}
