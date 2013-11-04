using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class Attackable : MonoBehaviour
{
    public Transform dotRoot;
    public GameObject onSyllableDotPrefab;
    public GameObject offSyllableDotPrefab;
    Vector2 dotSize = new Vector2(1.6f,1);
    float dotSpacing = 0.0f;

    List<GameObject> onDots = new List<GameObject>();
    List<GameObject> offDots = new List<GameObject>();

    public AudioClip dieClip;
    public GameObject dieFx;
    public GameObject crosshair;

    public GUIText word;
    public int difficulty;
    public float maxWordLifeTime = 0f;

    public GameEvent dieEvent = new GameEvent();

    private float wordLifeTime;

    void Awake()
    {
        wordLifeTime = Random.value * maxWordLifeTime;
    }

    void DestroyDots()
    {
        foreach( GameObject dot in onDots )
            Destroy(dot);
        foreach( GameObject dot in offDots )
            Destroy(dot);
        onDots.Clear();
        offDots.Clear();
    }

    void SwitchWord()
    {
        word.text = RhymeScorer.main.GetRandomPromptWord(difficulty);
        wordLifeTime = maxWordLifeTime;

        DestroyDots();
        int numSyls = RhymeScorer.main.GetNumSyllables(word.text);   // TEMP
        float width = numSyls * dotSize.x + (numSyls-1) * dotSpacing;
        Vector3 localPos = new Vector3( -width/2f+dotSize.x/2, 0, 0 );

        for( int i = 0; i < numSyls; i++ )
        {
            GameObject dot = Utility.Instantiate( onSyllableDotPrefab,
                    dotRoot.position + localPos,
                    dotRoot);
            dot.transform.Rotate( new Vector3(90, 0, 0) );
            onDots.Add(dot);

            dot = Utility.Instantiate( offSyllableDotPrefab,
                    dotRoot.position + localPos,
                    dotRoot);
            dot.transform.Rotate( new Vector3(90, 0, 0) );
            offDots.Add(dot);

            localPos.x += (dotSize.x + dotSpacing);
        }
    }

	// Use this for initialization
	void Start()
    {
        SwitchWord();
        wordLifeTime = Random.value * maxWordLifeTime;  // so not each drone is in lock step
        if( crosshair != null )
            crosshair.SetActive(false);
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

            word.color = Color.Lerp( Color.white, Color.red, Utility.Unlerp( maxWordLifeTime, 0, wordLifeTime ) );
        }
	
	}

    public void OnEnterBlastRadius(BlastRadius radius)
    {
    }

    public void OnExitBlastRadius(BlastRadius radius)
    {
        word.color = Color.white;

        if( crosshair != null )
            crosshair.SetActive(false);
    }

    public void OnIsInDanger()
    {
        if( crosshair != null )
            crosshair.SetActive(true);
        else
            word.color = Color.red;
    }

    public void OnIsNotInDanger()
    {
        if( crosshair != null )
            crosshair.SetActive(false);
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
        SendMessageUpwards( "OnAttackableDie", this );
        Destroy(gameObject);
    }

    public void OnDamaged()
    {
        OnDie();
    }

    public void OnPlayerWordChanged( string playerWord )
    {
    }
}
