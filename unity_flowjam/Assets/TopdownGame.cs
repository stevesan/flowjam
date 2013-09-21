
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class TopdownGame : MonoBehaviour
{
    public TopdownPlayer player;
    public TextInput input;
    public Bullet bulletPrefab;

    enum State { Loading, Moving, Typing };
    State state = State.Loading;

    public GameObject typeModeObjects;
    public GUIText typeModeText;
    public GUIText healthText;
    public AudioClip startTypingClip;
    public AudioClip fireBulletClip;
    public AudioClip cancelClip;
    public GameObject levelObjects;

    List<string> usedWords = new List<string>();

    void Awake()
    {
        levelObjects.SetActive(false);
    }

    void Start()
    {
        typeModeObjects.SetActive(false);
        bulletPrefab.gameObject.SetActive(false);
    }

    public TopdownPlayer GetPlayer()
    {
        return player;
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
                    bullet.Init(toTarget.normalized, input.GetInput());
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

        return true;
    }

    void UpdateHealth()
    {
        healthText.text = "";
        for( int i = 0; i < player.GetHealth(); i++ )
            healthText.text += "=";
    }

    void Update()
    {
        if( state == State.Loading )
        {
            if( RhymeScorer.main.GetIsReady() )
            {
                state = State.Moving;
                levelObjects.SetActive(true);
            }
        }
        else if( state == State.Moving )
        {
            UpdateHealth();

            if( Input.GetKeyDown(KeyCode.Space) )
            {
                EnterTypingMode();
            }
        }
        else if( state == State.Typing )
        {
            UpdateHealth();

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
                bool canAttackAny = false;
                foreach( Attackable target in targets )
                {
                    if( target == null )
                        continue;

                    if( IsTargetRhyming(target) )
                    {
                        canAttackAny = true;
                        target.OnIsInDanger();
                    }
                    else
                        target.OnIsNotInDanger();
                }

                if( canAttackAny )
                    typeModeText.color = Color.red;
                else
                    typeModeText.color = Color.white;
            }
        }
    }
}
