using UnityEngine;
using System.Collections;
using SteveSharp;

/*
TODOS:

*/

public class Attackable : MonoBehaviour
{
    public AudioClip dieClip;
    public GameObject dieFx;

    public GUIText word;
    public int difficulty;
    public float maxWordLifeTime = 0f;

    public GameEvent dieEvent = new GameEvent();

    private float wordLifeTime = 0f;

    void SwitchWord()
    {
        word.text = RhymeScorer.main.GetRandomPromptWord(difficulty);
        wordLifeTime = maxWordLifeTime;
    }

	// Use this for initialization
	void Start()
    {
        SwitchWord();
	}
	
	// Update is called once per frame
	void Update()
    {
        if( maxWordLifeTime > 0 )
        {
            wordLifeTime -= Time.deltaTime;
            if( wordLifeTime < 0 )
            {
                SwitchWord();
            }
        }
	
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
        AudioSource.PlayClipAtPoint( dieClip, transform.position );
        if( dieFx != null )
            Utility.Instantiate(dieFx, transform.position);
        dieEvent.Trigger(this);
        Destroy(gameObject);
    }

    public void OnDamaged()
    {
        OnDie();
    }
}
