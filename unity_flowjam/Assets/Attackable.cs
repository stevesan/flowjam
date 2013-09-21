using UnityEngine;
using System.Collections;
using SteveSharp;

public class Attackable : MonoBehaviour
{
    public AudioClip onDieClip;

    public GUIText word;
    public int difficulty;

    public GameEvent dieEvent = new GameEvent();

	// Use this for initialization
	void Start()
    {
        word.text = RhymeScorer.main.GetRandomPromptWord(difficulty);
	}
	
	// Update is called once per frame
	void Update () {
	
	}

    public void OnEnterBlastRadius(BlastRadius radius)
    {
        word.color = Color.white;
    }

    public void OnExitBlastRadius(BlastRadius radius)
    {
        word.color = Color.white;
    }

    public void OnIsInDanger()
    {
        word.color = Color.red;
    }

    public void OnIsNotInDanger()
    {
        word.color = Color.white;
    }

    public string GetWord()
    {
        return word.text;
    }

    void OnDie()
    {
        AudioSource.PlayClipAtPoint( onDieClip, transform.position );
        dieEvent.Trigger(this);
        Destroy(gameObject);
    }

    public void OnDamaged()
    {
        OnDie();
    }
}
