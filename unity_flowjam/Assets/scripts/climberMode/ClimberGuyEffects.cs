using UnityEngine;
using System.Collections;

public class ClimberGuyEffects : MonoBehaviour
{
    tk2dSpriteAnimator anim;

    void Awake()
    {
        anim = GetComponent<tk2dSpriteAnimator>();
    }

    void OnMoveEnd()
    {
        anim.Pause();
    }

    void OnMoveBegin()
    {
        anim.Play();
        anim.Resume();
    }
}
