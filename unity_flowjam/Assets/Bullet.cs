
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class Bullet : MonoBehaviour
{
    public float speed = 10f;
    public float hitRadius = 1f;
    public AudioClip dudClip;
    public GameObject hitFx;

    Vector3 dir = Vector3.zero;
    string word;


    public void Init(Vector3 dir, string word)
    {
        this.dir = dir;
        this.word = word;
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
            if( target != null && RhymeScorer.main.ScoreWords(word, target.GetWord()) > 0 )
            {
                target.OnDamaged();
            }
            else
            {
                AudioSource.PlayClipAtPoint( dudClip, transform.position );
            }

            Destroy(gameObject);
            Utility.Instantiate(hitFx, transform.position);
        }
    }
}
