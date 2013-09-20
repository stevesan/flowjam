
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class TopdownGame : MonoBehaviour
{
    public TopdownPlayer player;
    public TextInput input;
    public Bullet bulletPrefab;

    enum State { Moving, Typing };
    State state = State.Moving;

    public GameObject typeModeObjects;
    public GUIText typeModeText;
    public AudioClip startTypingClip;
    public AudioClip fireBulletClip;
    public AudioClip cancelClip;

    List<string> usedWords = new List<string>();

    void Start()
    {
        typeModeObjects.SetActive(false);
        bulletPrefab.gameObject.SetActive(false);
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

    void ExitTypingMode(bool attack)
    {
        player.respondToInput = true;  
        state = State.Moving;
        typeModeObjects.SetActive(false);

        bool bulletsFired = false;

        if( attack )
        {
            // gather enemies within radius
            // damage them if their word rhymes with this one
            // if any damaged, put word in cooldown queue
            HashSet<Attackable> targets = player.GetBlastRadius().GetActiveTargets();
            foreach( Attackable target in targets )
            {
                if( target == null )
                    continue;

                if( IsTargetRhyming( target ) )
                {
                    Vector3 toTarget = target.transform.position - player.transform.position;
                    Bullet bullet = Utility.MyInstantiate<Bullet>(bulletPrefab, player.transform.position );
                    bullet.SetDirection(toTarget.normalized);
                    bulletsFired = true;

                }
                target.OnIsNotInDanger();
            }
        }

        if( bulletsFired )
            AudioSource.PlayClipAtPoint(fireBulletClip, player.transform.position);
        else
            AudioSource.PlayClipAtPoint(cancelClip, player.transform.position);
    }

    bool IsTargetRhyming( Attackable target )
    {
        if( target == null )
            return false;

        if( RhymeScorer.main.ScoreWords( input.GetInput(), target.GetWord() ) == 0 )
            return false;

        // Visible
        /*
        Vector3 toTarget = target.transform.position - player.transform.position;
        RaycastHit hit = new RaycastHit();
        bool inDanger = false;
        if( Physics.Raycast( player.transform.position, toTarget.normalized, out hit ) )
        {
            Attackable hitTarget = UnityUtils.FindAncestor<Attackable>(hit.collider.gameObject);
            if( hitTarget == target )
                return true;
        }
        */
        return true;

        //return false;
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
                ExitTypingMode(!Input.GetKeyDown(KeyCode.Escape));
            }
            else
            {
                typeModeText.text = "["+input.GetInput()+"]";

                // gather enemies within radius
                // highlight them if their word rhymes with this one
                HashSet<Attackable> targets = player.GetBlastRadius().GetActiveTargets();
                foreach( Attackable target in targets )
                {
                    if( target == null )
                        continue;

                    if( IsTargetRhyming(target) )
                        target.OnIsInDanger();
                    else
                        target.OnIsNotInDanger();
                }
            }
        }
    }
}
