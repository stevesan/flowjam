using UnityEngine;
using System.Collections;

public class Attackable : MonoBehaviour
{
    public AudioClip onDieClip;

    public GUIText word;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

    public void OnEnterBlastRadius(BlastRadius radius)
    {
        Debug.Log("entered");
        word.color = Color.green;
    }

    public void OnExitBlastRadius(BlastRadius radius)
    {
        Debug.Log("exited");
        word.color = Color.white;
    }

    public void OnIsInDanger()
    {
        word.color = Color.red;
    }

    public void OnIsNotInDanger()
    {
        word.color = Color.green;
    }

    public string GetWord()
    {
        return word.text;
    }

    public void OnDamaged()
    {
        AudioSource.PlayClipAtPoint( onDieClip, transform.position );
        Destroy(gameObject);
    }
}
