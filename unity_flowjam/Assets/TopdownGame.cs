
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class TopdownGame : MonoBehaviour
{
    public TopdownPlayer player;
    public TextInput input;

    enum State { Moving, Typing };
    State state = State.Moving;

    public GameObject typeModeObjects;
    public GUIText typeModeText;
    public AudioClip startTypingClip;

    List<string> usedWords = new List<string>();

    void Start()
    {
        typeModeObjects.SetActive(false);
    }

    void EnterTypingMode()
    {
        player.respondToInput = false;  
        state = State.Typing;
        typeModeObjects.SetActive(true);
        input.ClearInput();
        typeModeText.text = "_";
        AudioSource.PlayClipAtPoint(startTypingClip, Camera.main.transform.position);
    }

    void ExitTypingMode()
    {
        player.respondToInput = true;  
        state = State.Moving;
        typeModeObjects.SetActive(false);
        AudioSource.PlayClipAtPoint(startTypingClip, Camera.main.transform.position);

        // gather enemies within radius
        // damage them if their word rhymes with this one
        // if any damaged, put word in cooldown queue
        HashSet<Attackable> targets = player.GetBlastRadius().GetActiveTargets();
        foreach( Attackable target in targets )
        {
            if( target == null )
                continue;

            if( RhymeScorer.main.ScoreWords( input.GetInput(), target.GetWord() ) > 0 )
                target.OnDamaged();
            else
                target.OnIsNotInDanger();
        }
    }

    void Update()
    {
        if( state == State.Moving )
        {
            if( Input.GetKeyDown(KeyCode.Space) )
            {
                EnterTypingMode();
            }
        }
        else if( state == State.Typing )
        {
            if( Input.GetKeyDown(KeyCode.Space)
                    || Input.GetKeyDown(KeyCode.Return)
                    || Input.GetKeyDown(KeyCode.Escape) )
            {
                ExitTypingMode();
            }
            else
            {
                typeModeText.text = input.GetInput()+"_";

                // gather enemies within radius
                // highlight them if their word rhymes with this one
                HashSet<Attackable> targets = player.GetBlastRadius().GetActiveTargets();
                foreach( Attackable target in targets )
                {
                    if( target == null )
                        continue;

                    if( RhymeScorer.main.ScoreWords( input.GetInput(), target.GetWord() ) > 0 )
                        target.OnIsInDanger();
                    else
                        target.OnIsNotInDanger();
                }
            }
        }
    }
}
